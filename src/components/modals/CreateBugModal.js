'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { toast } from 'sonner';

const CreateBugModal = ({ isOpen, onClose, recordingId = null }) => {
    const { actions } = useApp();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('Medium');
    const [status, setStatus] = useState('Open');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Bug title is required.', { duration: 5000 });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await actions.createBug({
                title: title.trim(),
                description: description.trim(),
                severity,
                status,
                recordingId,
            });
            if (result.success) {
                actions.openModal('linkResources');
                actions.updateSelection('bugs', [result.data]);
            }
            setTitle('');
            setDescription('');
            setSeverity('Medium');
            setStatus('Open');
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {recordingId ? 'Report Bug from Recording' : 'Report Bug'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter bug title"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter bug description"
                            rows={4}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="severity" className="block text-sm font-medium text-gray-700">Severity</label>
                        <select
                            id="severity"
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                    <div className="mb-6">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                        >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                    {recordingId && (
                        <p className="text-sm text-gray-600 mb-4">This bug will be linked to recording ID: {recordingId}</p>
                    )}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Report Bug'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBugModal;