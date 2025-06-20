// components/bug-report/SprintManagement.js

import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useProject } from '../../context/ProjectContext';
import { toast } from 'sonner';
import { Calendar, Plus, Edit2, Trash2 } from 'lucide-react';

const SprintManagement = ({ sprints, onClose }) => {
    const { activeProject, user } = useProject();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingSprint, setEditingSprint] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'planned'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Sprint name is required');
            return;
        }

        try {
            const sprintData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                status: formData.status,
                projectId: activeProject.id,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            if (editingSprint) {
                await updateDoc(doc(db, 'sprints', editingSprint.id), {
                    ...sprintData,
                    createdAt: editingSprint.createdAt, // Preserve original creation
                });
                toast.success('Sprint updated successfully');
            } else {
                await addDoc(collection(db, 'sprints'), sprintData);
                toast.success('Sprint created successfully');
            }

            setFormData({
                name: '',
                description: '',
                startDate: '',
                endDate: '',
                status: 'planned'
            });
            setShowCreateForm(false);
            setEditingSprint(null);
        } catch (error) {
            console.error('Error saving sprint:', error);
            toast.error('Error saving sprint');
        }
    };

    const handleEdit = (sprint) => {
        setEditingSprint(sprint);
        setFormData({
            name: sprint.name,
            description: sprint.description || '',
            startDate: sprint.startDate ? new Date(sprint.startDate.seconds * 1000).toISOString().split('T')[0] : '',
            endDate: sprint.endDate ? new Date(sprint.endDate.seconds * 1000).toISOString().split('T')[0] : '',
            status: sprint.status || 'planned'
        });
        setShowCreateForm(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'planned': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Not set';
        const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
        return dateObj.toLocaleDateString();
    };

    return (
        <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
            <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Sprint Management</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center px-4 py-2 bg-[#00897B] text-white rounded-lg hover:bg-[#00796B] transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Sprint
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div className="p-6">
                {/* Create/Edit Form */}
                {showCreateForm && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">
                            {editingSprint ? 'Edit Sprint' : 'Create New Sprint'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sprint Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                                        placeholder="e.g., Sprint 1, Feature Release"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                                    >
                                        <option value="planned">Planned</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                                    rows={3}
                                    placeholder="Brief details about the sprint goals or scope"
                                />
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#00897B] text-white rounded-lg hover:bg-[#00796B] transition-colors"
                                >
                                    {editingSprint ? 'Update Sprint' : 'Create Sprint'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setEditingSprint(null);
                                        setFormData({
                                            name: '',
                                            description: '',
                                            startDate: '',
                                            endDate: '',
                                            status: 'planned',
                                        });
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Sprint List */}
                <div className="space-y-4">
                    {sprints.length === 0 ? (
                        <p className="text-gray-500 text-sm">No sprints available.</p>
                    ) : (
                        sprints.map((sprint) => (
                            <div key={sprint.id} className="p-4 border rounded-lg shadow-sm bg-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-md font-semibold">{sprint.name}</h4>
                                        <div
                                            className={`inline-block px-2 py-1 text-xs rounded ${getStatusColor(
                                                sprint.status
                                            )} mt-1`}
                                        >
                                            {sprint.status}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {sprint.description}
                                        </p>
                                        <div className="mt-2 text-sm text-gray-600 flex gap-4">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(sprint)}
                                            className="p-2 rounded hover:bg-gray-100"
                                            title="Edit Sprint"
                                        >
                                            <Edit2 className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button
                                            onClick={() => toast.warning('Delete functionality not implemented')}
                                            className="p-2 rounded hover:bg-gray-100"
                                            title="Delete Sprint"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SprintManagement;
