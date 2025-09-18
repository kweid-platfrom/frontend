import React, { useState, useCallback, useEffect } from 'react';
import { XCircle, Tag } from 'lucide-react';

// Recommendation Modal Component
const RecommendationModal = ({ recommendation, onSave, onClose, currentUser, actions }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        rationale: '',
        status: 'under-review',
        priority: 'medium',
        category: 'ui-ux',
        impact: 'medium',
        effort: 'medium',
        assignee: '',
        tags: [],
        due_date: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Initialize form data when component mounts or recommendation changes
    useEffect(() => {
        if (recommendation) {
            setFormData({
                title: recommendation.title || '',
                description: recommendation.description || '',
                rationale: recommendation.rationale || '',
                status: recommendation.status || 'under-review',
                priority: recommendation.priority || 'medium',
                category: recommendation.category || 'ui-ux',
                impact: recommendation.impact || 'medium',
                effort: recommendation.effort || 'medium',
                assignee: recommendation.assignee || '',
                tags: recommendation.tags || [],
                due_date: recommendation.due_date || '',
            });
        } else {
            setFormData({
                title: '',
                description: '',
                rationale: '',
                status: 'under-review',
                priority: 'medium',
                category: 'ui-ux',
                impact: 'medium',
                effort: 'medium',
                assignee: '',
                tags: [],
                due_date: '',
            });
        }
        setErrors({});
    }, [recommendation]);

    // Validate form data
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters long';
        }
        
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters long';
        }
        
        if (formData.due_date && new Date(formData.due_date) < new Date()) {
            newErrors.due_date = 'Due date cannot be in the past';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const dataToSave = {
                ...formData,
                title: formData.title.trim(),
                description: formData.description.trim(),
                rationale: formData.rationale.trim(),
                id: recommendation?.id,
                updated_at: new Date().toISOString(),
                ...(recommendation ? {} : { 
                    created_at: new Date().toISOString(),
                    upvotes: 0,
                    downvotes: 0,
                    userVotes: {},
                    comments: [],
                    created_by: currentUser?.uid || 'anonymous'
                })
            };

            const result = await onSave(dataToSave);
            
            if (result && result.success !== false) {
                actions?.ui?.showNotification({
                    id: 'recommendation-save-success',
                    type: 'success',
                    message: `Recommendation ${recommendation ? 'updated' : 'created'} successfully`,
                    duration: 2000
                });
                onClose();
            } else {
                throw new Error(result?.error?.message || 'Failed to save recommendation');
            }
        } catch (error) {
            console.error('Error submitting recommendation:', error);
            actions?.ui?.showNotification({
                id: 'recommendation-save-error',
                type: 'error',
                message: error.message || 'Failed to save recommendation',
                duration: 3000
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, recommendation, onSave, onClose, currentUser, actions,]);

    const handleTagsChange = (e) => {
        const tagString = e.target.value;
        const tags = tagString.split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
            .slice(0, 10); // Limit to 10 tags
        setFormData(prev => ({ ...prev, tags }));
    };

    const removeTag = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter((_, index) => index !== indexToRemove)
        }));
    };

    // Close modal when clicking outside
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
            onClick={handleBackdropClick}
        >
            <div 
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                    <h3 className="text-lg font-medium text-gray-900">
                        {recommendation ? 'Edit Recommendation' : 'New Feature Recommendation'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        disabled={isSubmitting}
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                errors.title ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Brief title for the feature recommendation"
                            disabled={isSubmitting}
                            maxLength={200}
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                        <p className="mt-1 text-xs text-gray-500">{formData.title.length}/200 characters</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                errors.description ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Detailed description of the feature or improvement..."
                            disabled={isSubmitting}
                            maxLength={1000}
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                        <p className="mt-1 text-xs text-gray-500">{formData.description.length}/1000 characters</p>
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                disabled={isSubmitting}
                            >
                                <option value="under-review">Under Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="in-development">In Development</option>
                                <option value="completed">Completed</option>
                                <option value="on-hold">On Hold</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                disabled={isSubmitting}
                            >
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                disabled={isSubmitting}
                            >
                                <option value="ui-ux">UI/UX</option>
                                <option value="performance">Performance</option>
                                <option value="security">Security</option>
                                <option value="integration">Integration</option>
                                <option value="analytics">Analytics</option>
                                <option value="accessibility">Accessibility</option>
                                <option value="automation">Automation</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Impact */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Impact
                            </label>
                            <select
                                value={formData.impact}
                                onChange={(e) => setFormData(prev => ({ ...prev, impact: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                disabled={isSubmitting}
                            >
                                <option value="high">High Impact</option>
                                <option value="medium">Medium Impact</option>
                                <option value="low">Low Impact</option>
                            </select>
                        </div>

                        {/* Effort */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Development Effort
                            </label>
                            <select
                                value={formData.effort}
                                onChange={(e) => setFormData(prev => ({ ...prev, effort: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                disabled={isSubmitting}
                            >
                                <option value="small">Small (1-2 days)</option>
                                <option value="medium">Medium (1-2 weeks)</option>
                                <option value="large">Large (1+ months)</option>
                            </select>
                        </div>

                        {/* Assignee */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assignee (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.assignee}
                                onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Assign to team member"
                                disabled={isSubmitting}
                                maxLength={100}
                            />
                        </div>
                    </div>

                    {/* Business Rationale */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Rationale
                        </label>
                        <textarea
                            rows={3}
                            value={formData.rationale}
                            onChange={(e) => setFormData(prev => ({ ...prev, rationale: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="Why is this feature important? What business value does it provide?"
                            disabled={isSubmitting}
                            maxLength={500}
                        />
                        <p className="mt-1 text-xs text-gray-500">{formData.rationale.length}/500 characters</p>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags (comma-separated, max 10)
                        </label>
                        <input
                            type="text"
                            value={formData.tags.join(', ')}
                            onChange={handleTagsChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="e.g. mobile, dashboard, user-experience"
                            disabled={isSubmitting}
                        />
                        {formData.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {formData.tags.map((tag, index) => (
                                    <span 
                                        key={index} 
                                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-teal-100 text-teal-800 gap-1"
                                    >
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(index)}
                                            className="text-teal-600 hover:text-teal-800"
                                            disabled={isSubmitting}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date (Optional)
                        </label>
                        <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                errors.due_date ? 'border-red-300' : 'border-gray-300'
                            }`}
                            disabled={isSubmitting}
                            min={new Date().toISOString().split('T')[0]}
                        />
                        {errors.due_date && <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>}
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {isSubmitting ? 'Saving...' : (recommendation ? 'Update' : 'Create')} Recommendation
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecommendationModal;