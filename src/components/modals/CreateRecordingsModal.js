'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { toast } from 'sonner';

const CreateRecordingModal = ({ isOpen, onClose }) => {
    const { actions } = useApp();
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [createBug, setCreateBug] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !url.trim()) {
            toast.error('Title and URL are required.', { duration: 5000 });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await actions.createRecording({
                title: title.trim(),
                url: url.trim(),
            });
            if (result.success) {
                if (createBug) {
                    actions.openModal('createBug');
                    actions.updateSelection('recordings', [result.data]);
                }
                toast.success('Recording created successfully', { duration: 5000 });
                setTitle('');
                setUrl('');
                setCreateBug(false);
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Recording</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter recording title"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700">Recording URL</label>
                        <input
                            id="url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter recording URL"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={createBug}
                                onChange={(e) => setCreateBug(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={isSubmitting}
                            />
                            <span className="ml-2 text-sm text-gray-600">Create a bug for this recording</span>
                        </label>
                    </div>
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
                            {isSubmitting ? 'Creating...' : 'Create Recording'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRecordingModal;