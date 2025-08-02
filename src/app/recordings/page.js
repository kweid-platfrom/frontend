/* eslint-disable @typescript-eslint/no-unused-vars */
// components/Recordings.jsx
'use client';

import React, { useState } from 'react';
import { useRecordings } from '../../hooks/useRecordings';
import { useUI } from '../../hooks/useUI';
import { useApp } from '../../context/AppProvider';

const Recordings = () => {
    const { recordings, canUseRecordings, recordingsLocked } = useRecordings();
    const { toggleSidebar, sidebarOpen } = useUI();
    const { actions } = useApp();
    const [selectedRecording, setSelectedRecording] = useState(null);

    const handleLinkToBug = async (recordingId, bugId) => {
        try {
            await actions.recordings.linkRecordingToBug(recordingId, bugId);
            actions.ui.showNotification('success', 'Recording linked to bug', 3000);
            setSelectedRecording(null);
        } catch (error) {
            actions.ui.showNotification('error', 'Failed to link recording', 5000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        {sidebarOpen ? 'Close' : 'Open'} Sidebar
                    </button>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                    {recordingsLocked ? (
                        <p className="text-gray-600">Recordings are locked. Upgrade to access.</p>
                    ) : canUseRecordings ? (
                        <div>
                            <p className="text-gray-600 mb-4">Recordings: {recordings.length}</p>
                            <div className="grid gap-4">
                                {recordings.map((recording) => (
                                    <div key={recording.id} className="border p-4 rounded-lg">
                                        <video src={recording.url} controls className="w-full max-w-md" />
                                        <p className="text-sm text-gray-500 mt-2">
                                            Created: {new Date(recording.created_at).toLocaleString()}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Size: {(recording.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        {recording.networkErrors?.length > 0 && (
                                            <p className="text-sm text-red-600">
                                                Network Errors: {recording.networkErrors.length}
                                            </p>
                                        )}
                                        {recording.bugId ? (
                                            <p className="text-sm text-blue-600">
                                                Linked to Bug: {recording.bugId}
                                            </p>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedRecording(recording.id)}
                                                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                Link to Bug
                                            </button>
                                        )}
                                        {selectedRecording === recording.id && (
                                            <div className="mt-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter Bug ID"
                                                    className="border rounded px-2 py-1 text-sm"
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleLinkToBug(recording.id, e.target.value);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-600">Upgrade to use recordings</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Recordings;