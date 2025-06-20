import React, { useState } from 'react';
import { X, Calendar, Flag, Plus } from 'lucide-react';

const GroupCreationModal = ({ show, onClose, groupBy, onCreateSprint }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        goals: []
    });
    const [newGoal, setNewGoal] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addGoal = () => {
        if (newGoal.trim()) {
            setFormData(prev => ({
                ...prev,
                goals: [...prev.goals, newGoal.trim()]
            }));
            setNewGoal('');
        }
    };

    const removeGoal = (index) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setIsLoading(true);
        try {
            if (groupBy === 'sprint' && onCreateSprint) {
                const sprintData = {
                    name: formData.name,
                    description: formData.description,
                    startDate: formData.startDate ? new Date(formData.startDate) : null,
                    endDate: formData.endDate ? new Date(formData.endDate) : null,
                    goals: formData.goals,
                    status: 'planned',
                    createdAt: new Date()
                };
                await onCreateSprint(sprintData);
            }
            // Handle other group types (month, etc.) here if needed
            
            // Reset form and close modal
            setFormData({
                name: '',
                description: '',
                startDate: '',
                endDate: '',
                goals: []
            });
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            // Handle error (show toast, etc.)
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.target.name === 'newGoal') {
            e.preventDefault();
            addGoal();
        }
    };

    if (!show) return null;

    const getModalTitle = () => {
        switch (groupBy) {
            case 'sprint':
                return 'Create New Sprint';
            case 'month':
                return 'Create New Month Group';
            default:
                return 'Create New Group';
        }
    };

    const getModalIcon = () => {
        switch (groupBy) {
            case 'sprint':
                return <Flag className="h-6 w-6 text-green-600" />;
            case 'month':
                return <Calendar className="h-6 w-6 text-blue-600" />;
            default:
                return <Plus className="h-6 w-6 text-gray-600" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        {getModalIcon()}
                        <h2 className="text-xl font-semibold text-gray-900">
                            {getModalTitle()}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name Field */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            {groupBy === 'sprint' ? 'Sprint Name' : 'Group Name'} *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={groupBy === 'sprint' ? 'e.g. Sprint 1, Q1 2024' : 'Enter group name'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Description Field */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder={
                                groupBy === 'sprint' 
                                    ? 'Describe the sprint objectives and scope...' 
                                    : 'Enter group description...'
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                        />
                    </div>

                    {/* Date Fields for Sprint */}
                    {groupBy === 'sprint' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    {/* Goals Field for Sprint */}
                    {groupBy === 'sprint' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sprint Goals
                            </label>
                            <div className="space-y-2">
                                {formData.goals.map((goal, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <span className="flex-grow text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                                            {goal}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeGoal(index)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        name="newGoal"
                                        value={newGoal}
                                        onChange={(e) => setNewGoal(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Add a sprint goal..."
                                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={addGoal}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!formData.name.trim() || isLoading}
                            className={`px-4 py-2 rounded-md transition-colors ${
                                !formData.name.trim() || isLoading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : groupBy === 'sprint'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-[#00897B] hover:bg-[#00796B] text-white'
                            }`}
                        >
                            {isLoading ? 'Creating...' : `Create ${groupBy === 'sprint' ? 'Sprint' : 'Group'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GroupCreationModal;