'use client';

import React, { useState } from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';

const ScreenRecorderButton = ({ setShowBugForm, actions }) => {
    const [isRecording, setIsRecording] = useState(false);

    const handleRecordingToggle = async () => {
        try {
            if (!isRecording) {
                // Start recording logic
                await actions.recordings.startRecording();
                setIsRecording(true);
                actions.ui.showNotification('info', 'Screen recording started', 3000);
            } else {
                // Stop recording logic
                await actions.recordings.stopRecording();
                setIsRecording(false);
                actions.ui.showNotification('success', 'Screen recording saved', 3000);
                setShowBugForm(true); // Open bug form after recording
            }
        } catch (error) {
            actions.ui.showNotification('error', 'Failed to toggle recording', 5000);
            console.error('Recording error:', error);
        }
    };

    return (
        <button
            onClick={handleRecordingToggle}
            className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 text-sm rounded-md transition-colors ${
                isRecording
                    ? 'text-red-700 bg-red-100 hover:bg-red-200'
                    : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
            <VideoCameraIcon className="h-4 w-4" />
            <span className="hidden lg:inline">{isRecording ? 'Stop Recording' : 'Record Screen'}</span>
        </button>
    );
};

export default ScreenRecorderButton;